/**
 * Created by Siver on 2018/7/11.
 * ReactDomPrinter节点转化为pdf进行打印
 */
import React from 'react'
import PropTypes from 'prop-types'
import html2canvas from 'html2canvas'
import pdfMake from 'pdfmake/build/pdfmake'
import pdfFonts from 'pdfmake/build/vfs_fonts'

export default class Dom2Pdf extends React.Component {
    static propTypes = {
        btnText: PropTypes.string,
        /** Dom'id to print */
        domID: PropTypes.string.isRequired,
        pageHeight: PropTypes.number,
        pageWidth: PropTypes.number,
        margin: PropTypes.shape({
            left: PropTypes.number,
            top: PropTypes.number,
            right: PropTypes.number,
            bottom: PropTypes.number,
        }),
        header: PropTypes.oneOfType([
            PropTypes.object,
            PropTypes.func,
        ]),
        footer: PropTypes.oneOfType([
            PropTypes.object,
            PropTypes.func,
        ]),
        pageSize: PropTypes.string
    };

    //a4纸的尺寸[595.28,841.89]，html页面生成的canvas在pdf中图片的宽高
    static defaultProps = {
        btnText: "转PDF",
        pageHeight: 841.89,
        pageWidth: 595.28,
        margin: {
            left: 20,
            top: 30,
            right: 20,
            bottom: 30
        },
        header: {
            columns: [
                {text: 'begin', alignment: 'left', margin: 5},
                {text: 'end', alignment: 'right', margin: 5}
            ]
        },
        footer: (currentPage, pageCount) => {
            return {
                text: currentPage.toString() + '/' + pageCount,
                alignment: 'center',
                margin: 5
            };
        },
        pageSize: 'A4'
    };

    constructor(props) {
        super(props);

        pdfMake.vfs = pdfFonts.pdfMake.vfs;

        this.state = {
            domID: this.props.domID
        }
    }

    componentWillReceiveProps(next) {
        if (next.domID !== this.props.domID) {
            this.setState({
                domID: next.domID
            });
        }
    }

    print = () => {
        let dom = document.getElementById(this.state.domID);
        html2canvas(dom).then(canvas => {
            const PAGE_H = this.props.pageHeight;
            const PAGE_W = this.props.pageWidth;
            const margin = this.props.margin;

            let IMG_W = PAGE_W - margin.left - margin.right;
            let IMG_H = PAGE_H - margin.top - margin.bottom;
            let pageData = canvas.toDataURL('image/jpeg', 1.0);
            let docDefinition = {
                pageSize: this.props.pageSize,
                footer: this.props.footer,
                header: this.props.header,
                pageMargins: [margin.left, margin.top, margin.right, margin.bottom],
            };
            //每页显示的实际图片高度;
            let pageHeight = canvas.width / IMG_W * IMG_H;
            //页面偏移
            let top = 0;
            //content
            let content = [];
            //当内容未超过pdf一页显示的范围，无需分页
            if (canvas.height < pageHeight) {
                content.push({
                    image: pageData,
                    margin: [0, 0],
                    width: IMG_W,
                    height: canvas.height * IMG_W / canvas.width
                });
            } else {
                while (top < canvas.height) {
                    let cutHeight = top + pageHeight > canvas.height ? canvas.height - top : pageHeight;
                    let obj = {
                        image: this.cutImg(canvas, cutHeight, canvas.width, top, 0),
                        margin: [0, 0],
                        width: IMG_W,
                        height: cutHeight * IMG_W / canvas.width,
                    };
                    top += pageHeight;
                    //分页
                    if (top < canvas.height) obj.pageBreak = 'after';
                    content.push(obj);
                }
            }
            docDefinition.content = content;
            pdfMake.createPdf(docDefinition).open();
        });
    };


    //canvas对图片进行裁剪
    cutImg = (imgData, height, width, top, left) => {
        let canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        canvas.getContext('2d').drawImage(imgData, left, top, width, height, 0, 0, width, height);
        // 保存图片信息
        return canvas.toDataURL('image/jpeg', 1.0);
    };

    render() {
        return (
            <button onClick={this.print}>{this.props.btnText}</button>
        )
    }
}